[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$mfaToken = Read-Host -Prompt "MFA Token"

$awsTemporaryCredentialsResponse = Get-STSSessionToken `
    -DurationInSeconds ([timespan]::FromHours(12).TotalSeconds) `
    -ProfileName personal-craig `
    -SerialNumber arn:aws:iam::289069649740:mfa/craig `
    -TokenCode $mfaToken `
    -Region eu-west-1

$awsTemporaryCredentials = $awsTemporaryCredentialsResponse.GetCredentials()
Set-AWSCredentials `
    -StoreAs personal-craig-mfa `
    -AccessKey $awsTemporaryCredentials.AccessKey `
    -SecretKey $awsTemporaryCredentials.SecretKey `
    -SessionToken $awsTemporaryCredentials.Token `
    -ProfileLocation ( Resolve-Path ~/.aws/credentials )