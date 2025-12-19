import { useState, useEffect } from 'react';
import { addAccount, getDashboard } from '../services/api';

export default function OnboardingPage() {
  const [accountId, setAccountId] = useState('');
  const [externalId, setExternalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState<{ currentAccountId: string; externalId: string } | null>(null);

  useEffect(() => {
    getDashboard().then(data => {
      if (data.config) {
        setConfig(data.config);
      }
    }).catch(console.error);
  }, []);

  const handleOneClick = async () => {
    if (!config) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await addAccount({
        accountId: config.currentAccountId,
        externalId: config.externalId
      });
      setSuccess(`Current account (${config.currentAccountId}) onboarded successfully!`);
    } catch (err) {
      setError('Failed to onboard current account. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = `AWSTemplateFormatVersion: '2010-09-09'
Description: CloudShrink satellite role
Parameters:
  ExternalId:
    Type: String
  CentralAccountId:
    Type: String
Resources:
  CloudShrinkSatelliteRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: CloudShrinkSatelliteRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::\${CentralAccountId}:role/CloudShrinkOrchestrator
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                sts:ExternalId: !Ref ExternalId
      Policies:
        - PolicyName: CloudShrinkSatellitePermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:DescribeVolumes
                  - ec2:DescribeSnapshots
                  - ec2:CreateSnapshot
                  - ec2:CreateVolume
                  - ec2:AttachVolume
                  - ec2:DetachVolume
                  - ec2:DeleteVolume
                  - ec2:CreateTags
                Resource: '*'
                Condition:
                  StringEquals:
                    ec2:ResourceTag/cloudshrink_enable: 'true'
              - Effect: Allow
                Action:
                  - ssm:SendCommand
                  - ssm:GetCommandInvocation
                Resource: '*'
              - Effect: Allow
                Action:
                  - iam:PassRole
                Resource: '*'
                Condition:
                  StringLikeIfExists:
                    iam:PassedToService:
                      - ec2.amazonaws.com
Outputs:
  RoleArn:
    Value: !GetAtt CloudShrinkSatelliteRole.Arn
`;
    const blob = new Blob([templateContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'satellite.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addAccount({ accountId, externalId });
      setSuccess('Account registered successfully!');
      setAccountId('');
    } catch (err) {
      setError('Failed to register account. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1>Onboard New Account</h1>

      {config && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(45deg, #2d2d3f, #1e1e2d)', borderRadius: '8px', border: '1px solid #4f46e5' }}>
          <h2 style={{ color: '#818cf8' }}>⚡ One-Click Onboarding</h2>
          <p style={{ marginBottom: '1rem', color: '#a0a0b0' }}>
            Deploying in this account? We've detected your configuration.
          </p>
          <div style={{ marginBottom: '1rem', background: '#1e1e2d', padding: '1rem', borderRadius: '4px' }}>
            <div><strong>Account ID:</strong> {config.currentAccountId}</div>
            <div><strong>Role:</strong> Ready (Self-Managed)</div>
          </div>
          <button
            onClick={handleOneClick}
            disabled={loading}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              background: loading ? '#6366f1' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Onboarding...' : 'Onboard This Account'}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#1e1e2d', borderRadius: '8px' }}>
        <h2>Step 1: Deploy Satellite Template</h2>
        <p style={{ marginBottom: '1rem', color: '#a0a0b0' }}>
          Download the CloudFormation template and deploy it in the target AWS account you want to manage.
        </p>
        <button onClick={handleDownloadTemplate} className="btn-primary" style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Download satellite.yaml
        </button>
        <div style={{ marginTop: '1rem', background: '#2d2d3f', padding: '1rem', borderRadius: '4px' }}>
          <strong>Parameters required during deployment:</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#a0a0b0' }}>
            <li><code>CentralAccountId</code>: 957650740525</li>
            <li><code>ExternalId</code>: (Create a secret string to enter below)</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', background: '#1e1e2d', borderRadius: '8px' }}>
        <h2>Step 2: Register Account</h2>
        <p style={{ marginBottom: '1rem', color: '#a0a0b0' }}>
          Enter the details of the deployed account below.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Account ID</label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. 123456789012"
              required
              style={{ width: '100%', padding: '0.75rem', background: '#2d2d3f', border: '1px solid #3f3f5f', borderRadius: '4px', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>External ID</label>
            <input
              type="text"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="The secret string you used in deployment"
              required
              style={{ width: '100%', padding: '0.75rem', background: '#2d2d3f', border: '1px solid #3f3f5f', borderRadius: '4px', color: 'white' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              background: loading ? '#6366f1' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Registering...' : 'Register Account'}
          </button>

          {error && <div style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</div>}
          {success && <div style={{ color: '#10b981', marginTop: '1rem' }}>{success}</div>}
        </form>
      </div>
    </div>
  );
}
