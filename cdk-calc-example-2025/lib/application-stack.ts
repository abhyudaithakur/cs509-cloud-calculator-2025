import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Duration } from 'aws-cdk-lib';

export class ApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // === VPC & networking (your real IDs) ================================
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
            vpcId: 'vpc-078ceb16fae86b688',
            availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
            privateSubnetIds: [
                'subnet-02b2719e9a122c38d',
                'subnet-072d3949c6d21f7a8',
                'subnet-0da3b4f9e9c9ae737',
            ],
        });

        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            'SG',
            'sg-03badd5218303cefc',
            {
                mutable: false,
            },
        );

        //   RDS_USER      = balaji
        //   RDS_PASSWORD  = balaji-calc
        //   RDS_HOST      = balaji-calc.c3oy04c2cbwl.us-east-2.rds.amazonaws.com
        //   RDS_DATABASE  = calcdb
        //
        const rdsUser = process.env.RDS_USER!;
        const rdsPassword = process.env.RDS_PASSWORD!;
        const rdsDatabase = process.env.RDS_DATABASE!;
        const rdsHost = process.env.RDS_HOST!;

        const commonLambdaEnv = {
            RDS_USER: rdsUser,
            RDS_PASSWORD: rdsPassword,
            RDS_DATABASE: rdsDatabase,
            RDS_HOST: rdsHost,
        };

        // === Default Lambda (for any routes that fall through) ===============
        const default_fn = new lambdaNodejs.NodejsFunction(
            this,
            'LambdaDefaultFunction',
            {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'default.handler',
                code: lambda.Code.fromAsset(path.join(__dirname, 'default')),
                vpc,
                securityGroups: [securityGroup],
                timeout: Duration.seconds(3),
                environment: commonLambdaEnv,
            },
        );

        // === API Gateway setup ===============================================
        const api_endpoint = new apigw.LambdaRestApi(this, 'calculatorapi', {
            handler: default_fn,
            restApiName: 'CalculatorAPI',
            proxy: false,
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
                allowHeaders: apigw.Cors.DEFAULT_HEADERS,
            },
        });

        const calcResource = api_endpoint.root.addResource('calc');
        const addResource = calcResource.addResource('add');
        const multResource = calcResource.addResource('mult');

        // NEW: /calc/subtract and /calc/divide resources
        const subtractResource = calcResource.addResource('subtract');
        const divideResource = calcResource.addResource('divide');

        const createConstantResource = calcResource.addResource('create-constant');
        const listConstantsResource = calcResource.addResource('list-constants');
        const deleteConstantResource = calcResource.addResource('delete-constant');
        const deleteConstantWithNameResource =
            deleteConstantResource.addResource('{name}');

        // Shared integration/response config
        const integration_parameters = {
            proxy: false,
            passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,
            integrationResponses: [
                {
                    statusCode: '200',
                    responseTemplates: {
                        'application/json': "$input.json('$')",
                    },
                    responseParameters: {
                        'method.response.header.Content-Type': "'application/json'",
                        'method.response.header.Access-Control-Allow-Origin': "'*'",
                        'method.response.header.Access-Control-Allow-Credentials': "'true'",
                    },
                },
                {
                    selectionPattern: '(\n|.)+',
                    statusCode: '400',
                    responseTemplates: {
                        'application/json': JSON.stringify({
                            state: 'error',
                            message:
                                "$util.escapeJavaScript($input.path('$.errorMessage'))",
                        }),
                    },
                    responseParameters: {
                        'method.response.header.Content-Type': "'application/json'",
                        'method.response.header.Access-Control-Allow-Origin': "'*'",
                        'method.response.header.Access-Control-Allow-Credentials': "'true'",
                    },
                },
            ],
        };

        const response_parameters = {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Content-Type': true,
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Credentials': true,
                    },
                },
                {
                    statusCode: '400',
                    responseParameters: {
                        'method.response.header.Content-Type': true,
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Credentials': true,
                    },
                },
            ],
        };

        // Path-parameter integration (for /delete-constant/{name})
        const path_parameter_integration = {
            proxy: true,
        };

        const path_response_parameters = {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Content-Type': true,
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Credentials': true,
                    },
                },
                {
                    statusCode: '400',
                    responseParameters: {
                        'method.response.header.Content-Type': true,
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Credentials': true,
                    },
                },
            ],
        };

        // === /calc/add =======================================================
        const add_fn = new lambdaNodejs.NodejsFunction(this, 'AddFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'add.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'add')),
            vpc,
            securityGroups: [securityGroup],
            timeout: Duration.seconds(3),
            environment: commonLambdaEnv,
        });

        addResource.addMethod(
            'POST',
            new apigw.LambdaIntegration(add_fn, integration_parameters),
            response_parameters,
        );

        // === /calc/mult ======================================================
        const multiply_fn = new lambdaNodejs.NodejsFunction(
            this,
            'MultiplyFunction',
            {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'mult.handler',
                code: lambda.Code.fromAsset(path.join(__dirname, 'mult')),
                vpc,
                securityGroups: [securityGroup],
                timeout: Duration.seconds(3),
                environment: commonLambdaEnv,
            },
        );

        multResource.addMethod(
            'POST',
            new apigw.LambdaIntegration(multiply_fn, integration_parameters),
            response_parameters,
        );

        // === /calc/subtract ==================================================
        const subtract_fn = new lambdaNodejs.NodejsFunction(
            this,
            'SubtractFunction',
            {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'subtract.handler',
                code: lambda.Code.fromAsset(path.join(__dirname, 'subtract')),
                vpc,
                securityGroups: [securityGroup],
                timeout: Duration.seconds(3),
                environment: commonLambdaEnv,
            },
        );

        subtractResource.addMethod(
            'POST',
            new apigw.LambdaIntegration(subtract_fn, integration_parameters),
            response_parameters,
        );

        // === /calc/divide ====================================================
        const divide_fn = new lambdaNodejs.NodejsFunction(
            this,
            'DivideFunction',
            {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'divide.handler',
                code: lambda.Code.fromAsset(path.join(__dirname, 'divide')),
                vpc,
                securityGroups: [securityGroup],
                timeout: Duration.seconds(3),
                environment: commonLambdaEnv,
            },
        );

        divideResource.addMethod(
            'POST',
            new apigw.LambdaIntegration(divide_fn, integration_parameters),
            response_parameters,
        );

        // === /calc/create-constant ==========================================
        const create_constant_fn = new lambdaNodejs.NodejsFunction(
            this,
            'CreateConstantFunction',
            {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'create-constant.handler',
                code: lambda.Code.fromAsset(path.join(__dirname, 'create-constant')),
                vpc,
                securityGroups: [securityGroup],
                timeout: Duration.seconds(3),
                environment: commonLambdaEnv,
            },
        );

        createConstantResource.addMethod(
            'POST',
            new apigw.LambdaIntegration(create_constant_fn, integration_parameters),
            response_parameters,
        );

        // === /calc/list-constants ===========================================
        const list_constants_fn = new lambdaNodejs.NodejsFunction(
            this,
            'ListConstantsFunction',
            {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'list-constants.handler',
                code: lambda.Code.fromAsset(path.join(__dirname, 'list-constants')),
                vpc,
                securityGroups: [securityGroup],
                timeout: Duration.seconds(3),
                environment: commonLambdaEnv,
            },
        );

        listConstantsResource.addMethod(
            'GET',
            new apigw.LambdaIntegration(list_constants_fn, integration_parameters),
            response_parameters,
        );

        // === /calc/delete-constant ==========================================
        const delete_constant_fn = new lambdaNodejs.NodejsFunction(
            this,
            'DeleteConstantFunction',
            {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'delete-constant.handler',
                code: lambda.Code.fromAsset(path.join(__dirname, 'delete-constant')),
                vpc,
                securityGroups: [securityGroup],
                timeout: Duration.seconds(3),
                environment: commonLambdaEnv,
            },
        );

        deleteConstantResource.addMethod(
            'POST',
            new apigw.LambdaIntegration(delete_constant_fn, integration_parameters),
            response_parameters,
        );

        // === /calc/delete-constant/{name} ===================================
        deleteConstantWithNameResource.addMethod(
            'DELETE',
            new apigw.LambdaIntegration(
                delete_constant_fn,
                path_parameter_integration,
            ),
            path_response_parameters,
        );
    }
}
