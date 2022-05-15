import { S3Bucket, S3BucketAcl, S3BucketPublicAccessBlock, S3BucketServerSideEncryptionConfigurationA, S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3";
import { Construct } from "constructs";

export class S3Utils
{
    public static StandardBucket(parent: Construct, name: string) : S3Bucket
    {
        const s3Bucket = new S3Bucket(parent, `${name}_s3_bucket`.replace(/-/g, '_').toLowerCase(), {
            bucket: name,
        });

        new S3BucketVersioningA(parent, `${name}_s3_bucket_versioning`.replace(/-/g, '_').toLowerCase(), {
            bucket: s3Bucket.id,
            versioningConfiguration: {
                status: 'Enabled'
            }
        });

        new S3BucketAcl(parent, `${name}_s3_acl`.replace(/-/g, '_').toLowerCase(), {
            bucket: s3Bucket.id,
            acl: 'private'
        });

        new S3BucketServerSideEncryptionConfigurationA(parent, `${name}_s3_bucket_encryption`.replace(/-/g, '_').toLowerCase(), {
            bucket: s3Bucket.id,
            rule: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256'
                    }
                }
            ]
        });

        new S3BucketPublicAccessBlock(parent, `${name}_s3_bucket_public_access`.replace(/-/g, '_').toLowerCase(), {
            bucket: s3Bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        });

        return s3Bucket;
    }
}