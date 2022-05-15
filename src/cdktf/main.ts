import { App } from "cdktf";
import { IamCoreStack } from "./IamCoreStack";
import { S3BackupStack } from "./s3-backup-stack";
import { TerraformS3StateStack } from "./TerraformS3StateStack";

const app = new App();
new TerraformS3StateStack(app);
new IamCoreStack(app);
new S3BackupStack(app);
app.synth();
