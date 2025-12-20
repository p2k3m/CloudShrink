import json
import logging
import os
from typing import Any, Dict, List

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ASSUME_ROLE = os.environ.get('SATELLITE_ROLE_NAME', 'CloudShrinkSatelliteRole')
dynamodb = boto3.resource('dynamodb')
VOLUMES_TABLE = os.environ.get('VOLUMES_TABLE', 'CloudShrinkVolumes')


ACCOUNTS_TABLE = os.environ.get('ACCOUNTS_TABLE')


def lambda_handler(event: Dict[str, Any], _context: Any):
  logger.info('Starting discovery %s', json.dumps(event))

  # 1. Handle Direct Invocation (Manual list)
  if 'accounts' in event:
    accounts = event['accounts']
  
  # 2. Handle DynamoDB Stream (New Account Added)
  elif 'Records' in event:
    accounts = []
    for record in event['Records']:
      if record.get('eventName') == 'INSERT' and 'NewImage' in record.get('dynamodb', {}):
        image = record['dynamodb']['NewImage']
        accounts.append({
          'accountId': image.get('accountId', {}).get('S'),
          'externalId': image.get('externalId', {}).get('S')
        })
    logger.info("Triggered by DynamoDB Stream. Found %d new accounts.", len(accounts))

  # 3. Handle Schedule (or Fallback) -> Scan All
  else:
    logger.info("No specific target found. Scanning all accounts.")
    accounts = _scan_accounts()

  results: List[Dict[str, Any]] = []
  for account in accounts:
    if not account.get('accountId') or not account.get('externalId'):
      logger.warning("Skipping invalid account record: %s", account)
      continue

    try:
      account_id = account['accountId']
      creds = assume(account_id, account['externalId'])
      ec2 = boto3.client('ec2', aws_access_key_id=creds['AccessKeyId'], aws_secret_access_key=creds['SecretAccessKey'], aws_session_token=creds['SessionToken'])
      volumes = discover_account(ec2)
      results.extend(volumes)
    except Exception as e:
      logger.error(f"Failed to discover account {account.get('accountId')}: {e}")
      
  persist(results)
  return {'items': results}


def _scan_accounts() -> List[Dict[str, str]]:
  if not ACCOUNTS_TABLE:
    logger.warning("ACCOUNTS_TABLE not set, cannot scan.")
    return []
  table = dynamodb.Table(ACCOUNTS_TABLE)
  resp = table.scan()
  return [{'accountId': i['accountId'], 'externalId': i['externalId']} for i in resp.get('Items', [])]



def assume(account_id: str, external_id: str) -> Dict[str, str]:
  sts = boto3.client('sts')
  res = sts.assume_role(RoleArn=f'arn:aws:iam::{account_id}:role/{ASSUME_ROLE}', RoleSessionName='cloudshrink-discovery', ExternalId=external_id)
  return res['Credentials']


def discover_account(ec2_client) -> List[Dict[str, Any]]:
  resp = ec2_client.describe_volumes(Filters=[{'Name': 'tag:cloudshrink_enable', 'Values': ['true']}])
  volumes = []
  for vol in resp.get('Volumes', []):
    attachments = [a for a in vol.get('Attachments', []) if not a.get('DeleteOnTermination')]
    for att in attachments:
      instance_id = att['InstanceId']
      volume_record = {
        'volumeId': vol['VolumeId'],
        'instanceId': instance_id,
        'sizeGb': vol['Size'],
        'eligible': True,
        'status': 'DISCOVERED',
      }
      volumes.append(volume_record)
  return volumes


def persist(items: List[Dict[str, Any]]):
  table = dynamodb.Table(VOLUMES_TABLE)
  with table.batch_writer() as writer:
    for item in items:
      writer.put_item(Item=item)
