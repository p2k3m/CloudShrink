import json
import logging
import os
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event: Dict[str, Any], _context: Any):
  logger.info('Triggering workflow: %s', json.dumps(event))
  if not STATE_MACHINE_ARN:
    raise RuntimeError('STATE_MACHINE_ARN not configured')
  response = stepfunctions.start_execution(stateMachineArn=STATE_MACHINE_ARN, input=json.dumps(event))
  return {'executionArn': response['executionArn']}
