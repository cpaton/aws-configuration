import { IamPolicy, IamRole, IamRolePolicyAttachment, IamUser, IamUserPolicy } from "@cdktf/provider-aws/lib/iam";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3";
import { TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { Common } from "./common";
import { S3Utils } from "./s3";

export class S3BackupStack extends TerraformStack
{
    constructor(scope: Construct)
    {
        super(scope, 's3-backup');

        Common.InitialiseAwsProvider(this);
        Common.S3Backend(this);

        const s3Buckets: S3Bucket[] = [
            S3Utils.StandardBucket(this, 'paton-backup-gmail-backup'),
            S3Utils.StandardBucket(this, 'paton-backup-git'),
            S3Utils.StandardBucket(this, 'paton-backup-music'),
            S3Utils.StandardBucket(this, 'paton-backup-office-365'),
            S3Utils.StandardBucket(this, 'paton-backup-pictures'),
            S3Utils.StandardBucket(this, 'paton-backup-repository'),
            S3Utils.StandardBucket(this, 'paton-backup-repository-copy'),
            S3Utils.StandardBucket(this, 'paton-backup-video'),
        ]

        const policy = new IamPolicy(this, 'backup-writer-iam-policy', {
            name: 's3-backup-writer',
            policy: JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "S3Write",
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket",
                            "s3:GetObject",
                            "s3:DeleteObject",
                            "s3:PutObject",
                            "s3:PutObjectACL"

                        ],
                        "Resource": s3Buckets.map(x => [ x.arn, `${x.arn}/*` ]).flat()
                    }
                ]
            })
        });

        const iamUser = new IamUser(this, 's3-backup-writer', {
            name: 's3-backup-writer'
        });

        const iamRole = new IamRole(this, 's3-backup-writer-role', {
            name: 's3-backup-writer',
            assumeRolePolicy: JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": iamUser.arn
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            forceDetachPolicies: true
        });

        [policy].forEach(policy => {
            new IamRolePolicyAttachment(this, `${iamRole.nameInput}-${policy.nameInput}`.replace(/-/g, '_').toLowerCase(), {
                role: iamRole.name,
                policyArn: policy.arn
            });
        });

        [iamUser].forEach(user => {
            new IamUserPolicy(this, `${user.nameInput}-assume-${iamRole.nameInput!}`.replace(/-/g, '_').toLowerCase(), {
                name: ( `assume-role-${iamRole.nameInput!}`.toLowerCase() ),
                user: user.name,
                policy: JSON.stringify({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": "sts:AssumeRole",
                            "Resource": iamRole.arn
                        }
                    ]                
                })
            });
        });
    }
}