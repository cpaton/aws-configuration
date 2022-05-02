import { Construct } from "constructs";
import { App, TerraformStack, TerraformVariable, VariableType } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import { S3Bucket, S3BucketAcl, S3BucketPublicAccessBlock, S3BucketServerSideEncryptionConfigurationA, S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb";
import { DataAwsIamUser } from "@cdktf/provider-aws/lib/iam";

class TerraformS3StateStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const awsRegion = new TerraformVariable(this, 'aws-region', {
      type: VariableType.STRING,
      default: 'eu-west-1',
      description: "AWS region"
    })

    new AwsProvider(this, 'aws-provider', {
      region: awsRegion.stringValue,
      profile: 'personal-craig-mfa',
      assumeRole: {
        roleArn: 'arn:aws:iam::289069649740:role/Administrator',
        duration: '30m',
        sessionName: 'terraform-deploy'
      }
    });

    const s3Bucket = new S3Bucket(this, 'state_s3_bucket', {
      bucket: 'paton-terraform-state',
    });

    new S3BucketVersioningA(this, 'state_s3_bucket_versioning', {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled' 
      }
    });

    new S3BucketAcl(this, 's3_acl', {
      bucket: s3Bucket.id,
      acl: 'private'
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'state_s3_bucket_encryption', {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256'
          }
        }
      ]
    });

    new S3BucketPublicAccessBlock(this, 'state_s3_bucket_public_access', {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new DynamodbTable(this, 'dynamo_db_table', {
      name: 'terraform-state-locks',
      billingMode: 'PAY_PER_REQUEST',
      tableClass: 'STANDARD',
      hashKey: 'LockID',
      attribute: [
        {
          name: 'LockID',
          type: 'S'
        }
      ]
    })
  }
}

const app = new App();
new TerraformS3StateStack(app, "terraform-state");
app.synth();
