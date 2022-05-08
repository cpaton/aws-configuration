import { TerraformVariable, VariableType } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider, AwsProviderAssumeRole } from "@cdktf/provider-aws";

export class Common
{
    public static InitialiseAwsProvider(parent: Construct)
    {
        const awsRegion = new TerraformVariable(parent, 'aws-region', {
            type: VariableType.STRING,
            default: 'eu-west-1',
            description: "AWS region"
        });

        new AwsProvider(parent, 'aws-provider', {
            region: awsRegion.stringValue,
            profile: 'personal-craig-mfa',
            assumeRole: {
                roleArn: 'arn:aws:iam::289069649740:role/Administrator',
                duration: '30m',
                sessionName: 'terraform-deploy'
            }
        });
    }

    public static AssumeRole() : AwsProviderAssumeRole
    {
        return {
            roleArn: 'arn:aws:iam::289069649740:role/Administrator',
            duration: '30m',
            sessionName: 'terraform-deploy'
        }
    }
}