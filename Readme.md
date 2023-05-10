# Title
Reflection client for Node/Typescript for @grpc/grpc-js

# About
Package use Grpc reflection api to download gprc proto descriptor. Now you don't have to add proto file 
to each package. Simple direct download proto package from example microservice without any files.

## Install
```sh
npm install grpc-js-reflection-client
```

or
```
yarn add grpc-js-reflection-client
```

## How to use

### List services
```js
const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

/**
 * List services
 */
try {
    (async () => {
        const c = new GrpcReflection('0.0.0.0:50051', grpc.credentials.createInsecure());
        console.log(await c.listServices());
    })();

}catch(e){
    console.log(e);
}

```

### Download proto from reflection and execute executor

1. Download golang grpc reflection server
```sh
wget https://github.com/gawsoftpl/grpc-js-reflection-api-client/raw/main/tests/e2e/grpc-go-server-reflection/grpc-reflection-server
chmod +x grpc-reflection-server 
./grpc-reflection-server
```

2. Write grpc reflection client in nodejs
```js
cat <<EOF > script.js
const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

/**
 * Get proto descriptor from reflection grpc api and get in @grpc/grpc-js format
 *
 * */
try {
    (async()=>{
        // Connect with grpc server reflection
        const client = new GrpcReflection('0.0.0.0:50051', grpc.credentials.createInsecure());

        // Get services without proto file for specific symbol or file name
        const descriptor = await client.getDescriptorBySymbol('helloworld.Greeter');
        //const descriptor = await client.getDescriptorByFileName('examples/helloworld/helloworld/helloworld.proto');

        // Create package services
        const packageObject = descriptor.getPackageObject({
            keepCase: true,
            enums: String,
            longs: String
        });

        // Send request over grpc
        const proto = new packageObject.helloworld.Greeter(
            "localhost:50051",
            grpc.credentials.createInsecure(),
        );

        proto.SayHello({
            name: "abc"
        },(err,data)=>{
            if(err) {
                console.log(err);
            }else{
                console.log(data);
            }

        });
    })();
}catch(e){
    console.log(e);
}
EOF
```
3. Run script
```sh
node script.js 
```


## Nodejs Grpc reflection server
If you want to use grpc reflection server in NodeJS/Typescript use below package:
[https://github.com/papajuanito/grpc-node-server-reflection](https://github.com/papajuanito/grpc-node-server-reflection)