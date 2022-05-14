import { IamPolicy } from "@cdktf/provider-aws/lib/iam";
import { Construct } from "constructs";

export class IamPolicies
{
    public static ManageOwnMfaDevices(parent: Construct) : IamPolicy
    {
        return new IamPolicy(parent, 'manage-own-mfa-devices', {
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
    }

    public static ManageOwnAccessKeys(parent: Construct) : IamPolicy
    {
        return new IamPolicy(parent, 'manage-own-access-keys', {
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
    }
} 