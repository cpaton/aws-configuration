import { App } from "cdktf";
import { IamCoreStack } from "./IamCoreStack";
import { TerraformS3StateStack } from "./TerraformS3StateStack";

const app = new App();
new TerraformS3StateStack(app);
new IamCoreStack(app);
app.synth();
