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


def lambda_handler(event: Dict[str, Any], _context: Any):
  logger.info('Starting discovery %s', json.dumps(event))
  accounts = event.get('accounts', [])
  results: List[Dict[str, Any]] = []
  for account in accounts:
    account_id = account['accountId']
    creds = assume(account_id, account['externalId'])
    ec2 = boto3.client('ec2', aws_access_key_id=creds['AccessKeyId'], aws_secret_access_key=creds['SecretAccessKey'], aws_session_token=creds['SessionToken'])
    volumes = discover_account(ec2)
    results.extend(volumes)
  persist(results)
  return {'items': results}


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
