import { IamGroup, IamGroupPolicyAttachment, IamPolicy, IamRole, IamRolePolicyAttachment, IamUser, IamUserPolicy } from "@cdktf/provider-aws/lib/iam";
import { S3Backend, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { Common } from "./common";
import { TerraformS3StateStack } from "./TerraformS3StateStack";

export class IamCoreStack extends TerraformStack
{
    constructor(scope: Construct) {
        super(scope, 'iam-core');

        Common.InitialiseAwsProvider(this);

        new S3Backend(this, {
            key: 'iam-core.tfstate',
            region: "eu-west-1",
            profile: 'personal-craig-mfa',
            roleArn: 'arn:aws:iam::289069649740:role/Administrator',
            sessionName: 'terraform-deploy',
            bucket: TerraformS3StateStack.BucketName,
            dynamodbTable: TerraformS3StateStack.DynamodbLockTableName
        });

        const manageOwnMfaDevices = new IamPolicy(this, 'manage-own-mfa-devices', {
            name: 'manage-own-mfa-devices',
            // description: 'Allows users to manage their own MFA devices',
            policy: JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowViewAccountInfo",
                        "Effect": "Allow",
                        "Action": "iam:ListVirtualMFADevices",
                        "Resource": "*"
                    },
                    {
                        "Sid": "AllowManageOwnVirtualMFADevice",
                        "Effect": "Allow",
                        "Action": [
                            "iam:CreateVirtualMFADevice",
                            "iam:DeleteVirtualMFADevice"
                        ],
                        "Resource": "arn:aws:iam::*:mfa/$${aws:username}"
                    },
                    {
                        "Sid": "AllowManageOwnUserMFA",
                        "Effect": "Allow",
                        "Action": [
                            "iam:DeactivateMFADevice",
                            "iam:EnableMFADevice",
                            "iam:GetUser",
                            "iam:ListMFADevices",
                            "iam:ResyncMFADevice"
                        ],
                        "Resource": "arn:aws:iam::*:user/$${aws:username}"
                    },
                    {
                        "Sid": "DenyAllExceptListedIfNoMFA",
                        "Effect": "Deny",
                        "NotAction": [
                            "iam:CreateVirtualMFADevice",
                            "iam:EnableMFADevice",
                            "iam:GetUser",
                            "iam:ListMFADevices",
                            "iam:ListVirtualMFADevices",
                            "iam:ResyncMFADevice",
                            "sts:GetSessionToken"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "BoolIfExists": {
                                "aws:MultiFactorAuthPresent": "false"
                            }
                        }
                    }
                ]
            })
        });

        const manageOwnAccessKeys = new IamPolicy(this, 'manage-own-access-keys', {
            name: 'manage-own-access-keys',
            policy: JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "CreateOwnAccessKeys",
                        "Effect": "Allow",
                        "Action": [
                            "iam:CreateAccessKey",
                            "iam:GetUser",
                            "iam:ListAccessKeys"
                        ],
                        "Resource": "arn:aws:iam::*:user/$${aws:username}"
                    },
                    {
                        "Sid": "ManageOwnAccessKeys",
                        "Effect": "Allow",
                        "Action": [
                            "iam:CreateAccessKey",
                            "iam:DeleteAccessKey",
                            "iam:GetAccessKeyLastUsed",
                            "iam:GetUser",
                            "iam:ListAccessKeys",
                            "iam:UpdateAccessKey"
                        ],
                        "Resource": "arn:aws:iam::*:user/$${aws:username}"
                    }
                ]
            }
            )
        });

        const consoleUsers = new IamGroup(this, 'console-users', {
            name: 'console-users'
        });

        new IamGroupPolicyAttachment(this, `console-users-${manageOwnMfaDevices.nameInput}`, {
            group: consoleUsers.name,
            policyArn: manageOwnMfaDevices.arn
        });

        new IamGroupPolicyAttachment(this, `console-users-change-password`, {
            group: consoleUsers.name,
            policyArn: 'arn:aws:iam::aws:policy/IAMUserChangePassword'
        });

        const cliUsers = new IamGroup(this, 'cli-users', {
            name: 'cli-users'
        });

        new IamGroupPolicyAttachment(this, `cli-users-${manageOwnAccessKeys.nameInput}`, {
            group: cliUsers.name,
            policyArn: manageOwnAccessKeys.arn
        });

        new IamGroupPolicyAttachment(this, `cli-users-${manageOwnMfaDevices.nameInput}`, {
            group: cliUsers.name,
            policyArn: manageOwnMfaDevices.arn
        });

        const craig = new IamUser(this, 'craig', {
            name: 'craig'
        });

        const administrator = new IamRole(this, 'administrator', {
            name: 'Administrator',
            assumeRolePolicy: JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": [
                                craig.arn
                            ]
                        },
                        "Action": "sts:AssumeRole",
                        "Condition": {
                            "Bool": {
                                "aws:multifactorAuthPresent": "true"
                            }
                        }
                    }
                ]
            }),
            forceDetachPolicies: true
        });

        new IamRolePolicyAttachment(this, 'administrator-administrator', {
            role: administrator.name,
            policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
        });

        new IamUserPolicy(this, 'craig-assume-admin', {
            name: ( `assume-role-${administrator.nameInput}`.toLowerCase() ),
            user: craig.name,
            policy: JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": "sts:AssumeRole",
                        "Resource": administrator.arn
                    }
                ]                
            })
        });

                
    }
}