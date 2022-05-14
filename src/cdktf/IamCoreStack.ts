import { IamGroup, IamGroupMembership, IamGroupPolicyAttachment, IamPolicy, IamRole, IamRolePolicyAttachment, IamUser, IamUserGroupMembership, IamUserPolicy } from "@cdktf/provider-aws/lib/iam";
import { TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { Common } from "./common";
import { IamPolicies } from "./iam-policies";

/***
 * Core IAM setup for the account.
 * Base level groups for Console and CLI access intended for human operators
 * Individual users maybe assigned to none, one or both of those groups
 * Users only get permissions to assume other roles, they have limited permissions directly associated to them
 */
export class IamCoreStack extends TerraformStack
{
    constructor(scope: Construct) {
        super(scope, 'iam-core');

        Common.InitialiseAwsProvider(this);
        Common.S3Backend(this);

        // Policies
        const manageOwnMfaDevices = IamPolicies.ManageOwnMfaDevices(this);
        const manageOwnAccessKeys = IamPolicies.ManageOwnAccessKeys(this);

        // Groups
        const consoleUsers = this.ConfigureGroup('console-users', [ manageOwnMfaDevices ], [ { name: 'change-password', arn: 'arn:aws:iam::aws:policy/IAMUserChangePassword' } ]);
        const cliUsers = this.ConfigureGroup('cli-users', [ manageOwnAccessKeys, manageOwnMfaDevices ], []);

        // Users
        const craig = this.ConfigureUser('craig', [ consoleUsers, cliUsers ]);

        // Roles
        this.ConfigureRole('Administrator', [ craig ], [], [ { name: 'administrator', arn: 'arn:aws:iam::aws:policy/AdministratorAccess' } ]);
    }

    private ConfigureUser(name: string, groups: IamGroup[]) : IamUser
    {
        const iamUser = new IamUser(this, name.toLowerCase(), {
            name: name
        });

        groups.forEach(group => {
            new IamUserGroupMembership(this, `${name}-member-of-${group.nameInput}`.toLowerCase(), {
                user: iamUser.name,
                groups: [ group.name ]    
            })
        });

        return iamUser;
    }

    private ConfigureGroup(name: string, policies : IamPolicy[], managedPolicies : Readonly<IManagedPolicyDetails>[]) : IamGroup
    {
        const iamGroup = new IamGroup(this, name, {
            name: name
        });

        policies.forEach(iamPolicy => {
            new IamGroupPolicyAttachment(this, `${name}-${iamPolicy.nameInput}`, {
                group: iamGroup.name,
                policyArn: iamPolicy.arn
            });
        });

        managedPolicies.forEach(managedPolicy => {
            new IamGroupPolicyAttachment(this, `${name}-${managedPolicy.name}`, {
                group: iamGroup.name,
                policyArn: managedPolicy.arn
            });
        });

        return iamGroup;
    }

    private ConfigureRole(name: string, assumedBy: IamUser[], policies : IamPolicy[], managedPolicies : Readonly<IManagedPolicyDetails>[])
    {
        const iamRole = new IamRole(this, name.toLowerCase(), {
            name: name,
            assumeRolePolicy: JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": assumedBy.map(x => x.arn)
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

        policies.forEach(policy => {
            new IamRolePolicyAttachment(this, `${name.toLowerCase()}-${policy.nameInput}`, {
                role: iamRole.nameInput!,
                policyArn: policy.arn
            });
        });

        managedPolicies.forEach(managedPolicy => {
            new IamRolePolicyAttachment(this, `${name.toLowerCase()}-${managedPolicy.name}`, {
                role: iamRole.nameInput!,
                policyArn: managedPolicy.arn
            });
        });

        assumedBy.forEach(user => {
            new IamUserPolicy(this, `${user.nameInput}-assume-${name.toLowerCase()}`, {
                name: ( `assume-role-${name}`.toLowerCase() ),
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

interface IManagedPolicyDetails
{
    name : string
    arn: string
}