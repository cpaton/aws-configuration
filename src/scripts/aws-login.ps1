[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$sourceProfile = "personal-craig"
$mfaProfile = "personal-craig-mfa"

# Check if we already have active AWS credentials
$loggedIn = $false
try
{
    $currentCredentials = Get-STSCallerIdentity -ProfileName $mfaProfile
    Write-Verbose $currentCredentials
    $loggedIn = $true
}
catch
{
    Write-Verbose $_
}

if ($loggedIn)
{
    Write-Host "Already logged into AWS as $($mfaProfile)"
    return
}

$mfaToken = Read-Host -Prompt "MFA Token"

$awsTemporaryCredentialsResponse = Get-STSSessionToken `
    -DurationInSeconds ([timespan]::FromHours(12).TotalSeconds) `
    -ProfileName $sourceProfile `
    -SerialNumber arn:aws:iam::289069649740:mfa/craig `
    -TokenCode $mfaToken `
    -Region eu-west-1

$awsTemporaryCredentials = $awsTemporaryCredentialsResponse.GetCredentials()
Set-AWSCredentials `
    -StoreAs $mfaProfile `
    -AccessKey $awsTemporaryCredentials.AccessKey `
    -SecretKey $awsTemporaryCredentials.SecretKey `
    -SessionToken $awsTemporaryCredentials.Token `
    -ProfileLocation ( Resolve-Path ~/.aws/credentials )