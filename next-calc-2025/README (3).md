This contains the 2025 AWS Front-end that communicates with the back-end `cdk-calc-example-2025`


## Installing modules for `aws`

To properly install everything, do the following

```bash
npm install
```

Then to launch, type

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

![Enhanced GUI](enhanced-gui.png)

Now when you run, you will see a set of constants that are loaded up from the AWS backend. When you create a constant, it becomes visible to anyone that has access to that same API.

## Connection with CDK TypeScript Application With Lambda Functions

There is a companion project, https://gitlab03.wpi.edu/heineman/cdk-calc-example-2025, which contains the back-end that this front-end communicates with.
