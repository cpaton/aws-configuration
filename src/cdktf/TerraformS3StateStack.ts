import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { S3Bucket, S3BucketAcl, S3BucketPublicAccessBlock, S3BucketServerSideEncryptionConfigurationA, S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb";
import { Common } from "./common";

export class TerraformS3StateStack extends TerraformStack {
    public static readonly BucketName : string = 'paton-terraform-state';
    public static readonly DynamodbLockTableName : string = 'terraform-state-locks';

    constructor(scope: Construct) {
        super(scope, "terraform-state");

        Common.InitialiseAwsProvider(this);
        this.s3Bucket();
        this.dynamodbTable();
    }

    private dynamodbTable() {
        new DynamodbTable(this, 'dynamo_db_table', {
            name: TerraformS3StateStack.DynamodbLockTableName,
            billingMode: 'PAY_PER_REQUEST',
            tableClass: 'STANDARD',
            hashKey: 'LockID',
            attribute: [
                {
                    name: 'LockID',
                    type: 'S'
                }
            ]
        });
    }

    private s3Bucket() {
        const s3Bucket = new S3Bucket(this, 'state_s3_bucket', {
            bucket: TerraformS3StateStack.BucketName,
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
    }
}
