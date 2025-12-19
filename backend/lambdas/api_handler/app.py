import json
import logging
import os
from dataclasses import dataclass, asdict
from typing import Any, Dict, List

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
ACCOUNTS_TABLE = os.environ.get('ACCOUNTS_TABLE', 'CloudShrinkAccounts')
POLICIES_TABLE = os.environ.get('POLICIES_TABLE', 'CloudShrinkPolicies')
VOLUMES_TABLE = os.environ.get('VOLUMES_TABLE', 'CloudShrinkVolumes')
OPERATIONS_TABLE = os.environ.get('OPERATIONS_TABLE', 'CloudShrinkOperations')


@dataclass
class Response:
  statusCode: int
  body: str
  headers: Dict[str, str]

  @classmethod
  def ok(cls, payload: Dict[str, Any]):
    return cls(200, json.dumps(payload), {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization'})

  @classmethod
  def created(cls, payload: Dict[str, Any]):
    return cls(201, json.dumps(payload), {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization'})

  @classmethod
  def error(cls, message: str, status: int = 400):
    return cls(status, json.dumps({'message': message}), {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization'})


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
  logger.info('Received event %s', json.dumps(event))
  route_key = event.get('routeKey') or f"{event.get('httpMethod')} {event.get('path')}"
  try:
    if route_key == 'GET /accounts':
      return asdict(Response.ok({'items': _scan_table(ACCOUNTS_TABLE)}))
    if route_key == 'POST /accounts':
      body = json.loads(event.get('body') or '{}')
      _put_item(ACCOUNTS_TABLE, body)
      return asdict(Response.created(body))
    if route_key == 'GET /policies':
      return asdict(Response.ok({'items': _scan_table(POLICIES_TABLE)}))
    if route_key == 'POST /policies':
      body = json.loads(event.get('body') or '{}')
      _put_item(POLICIES_TABLE, body)
      return asdict(Response.created(body))
    if route_key == 'GET /volumes':
      filter_value = (event.get('queryStringParameters') or {}).get('filter', 'eligible')
      items = _scan_table(VOLUMES_TABLE)
      filtered = [i for i in items if filter_value == 'all' or str(i.get('eligible', False)).lower() == str(filter_value == 'eligible').lower()]
      return asdict(Response.ok({'items': filtered}))
    if route_key == 'POST /operations':
      body = json.loads(event.get('body') or '{}')
      operation = {**body, 'id': body.get('volumeId'), 'status': 'QUEUED'}
      _put_item(OPERATIONS_TABLE, operation)
      return asdict(Response.created(operation))
    if route_key == 'GET /operations/{id}':
      op_id = event.get('pathParameters', {}).get('id')
      table = dynamodb.Table(OPERATIONS_TABLE)
      response = table.get_item(Key={'id': op_id})
      return asdict(Response.ok(response.get('Item') or {}))
    if route_key == 'POST /scan':
      return asdict(Response.ok({'message': 'Scan trigger accepted'}))
    if route_key == 'GET /dashboard':
      accounts = _scan_table(ACCOUNTS_TABLE)
      volumes = _scan_table(VOLUMES_TABLE)
      protected = [v for v in volumes if str(v.get('eligible', '')).lower() == 'true']
      
      # Get current account details
      current_account_id = boto3.client('sts').get_caller_identity()['Account']
      external_id = os.environ.get('SATELLITE_EXTERNAL_ID', '')
      
      return asdict(Response.ok({
        'savings': '0 GB-month',  # Placeholder logic
        'protected_volumes': len(protected),
        'account_count': len(accounts),
        'config': {
          'currentAccountId': current_account_id,
          'externalId': external_id
        }
      }))
  except Exception as exc:  # noqa: BLE001
    logger.exception('Unhandled error')
    return asdict(Response.error(str(exc), status=500))

  return asdict(Response.error('Not found', status=404))


def _scan_table(name: str) -> List[Dict[str, Any]]:
  table = dynamodb.Table(name)
  resp = table.scan()
  return resp.get('Items', [])


def _put_item(name: str, item: Dict[str, Any]):
  table = dynamodb.Table(name)
  table.put_item(Item=item)
