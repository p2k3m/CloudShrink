import json
import logging
import os
from typing import Any, Dict, List

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

POLICIES_TABLE = os.environ.get('POLICIES_TABLE', 'CloudShrinkPolicies')
VOLUMES_TABLE = os.environ.get('VOLUMES_TABLE', 'CloudShrinkVolumes')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event: Dict[str, Any], _context: Any):
  logger.info('Evaluating policies for %s', json.dumps(event))
  policies = _scan_table(POLICIES_TABLE)
  volumes = _scan_table(VOLUMES_TABLE)
  updated: List[Dict[str, Any]] = []
  for vol in volumes:
    vol['eligible'] = _is_eligible(vol, policies)
    updated.append(vol)
  _persist(updated)
  return {'items': updated}


def _is_eligible(volume: Dict[str, Any], policies: List[Dict[str, Any]]) -> bool:
  if not policies:
    return False
  policy = policies[0]
  return volume.get('sizeGb', 0) >= policy.get('minSizeGb', 0)


def _scan_table(name: str) -> List[Dict[str, Any]]:
  table = dynamodb.Table(name)
  resp = table.scan()
  return resp.get('Items', [])


def _persist(items: List[Dict[str, Any]]):
  table = dynamodb.Table(VOLUMES_TABLE)
  with table.batch_writer() as writer:
    for item in items:
      writer.put_item(Item=item)
