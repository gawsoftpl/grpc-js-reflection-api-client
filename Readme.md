# Title
Reflection client for Node/Typescript for @grpc/grpc-js

# About
Package use Grpc reflection api to download gprc proto descriptor. Now you don't have to add proto file 
to each package. Simple direct download proto package from example microservice without any files.

## How to use

### List services
```js
import { GrpcReflection } from 'grpc-js-reflection-client';
import * as grpc from '@grpc/grpc-js';

/**
 * List services
 */
try {
    (async () => {
        const c = new GrpcReflection('0.0.0.0:3000', grpc.credentials.createInsecure());
        console.log(await c.listServices());
    })();

}catch(e){
    console.log(e);
}

```

### Download proto from reflection and execute method
```js
//import { GrpcReflection } from 'grpc-js-reflection-client';
import { GrpcReflection } from '../src/GrpcReflection';
import * as grpc from '@grpc/grpc-js';

/**
 * Get proto descriptor from reflection grpc api and get in @grpc/grpc-js format
 *
 * */
try {
    (async () => {
        // Connect with grpc reflection server
        const c = new GrpcReflection('0.0.0.0:3000', grpc.credentials.createInsecure());

        // Find protobufjs descriptor by symbol in grpc reflection server
        const descriptor = await c.getDescriptorBySymbol('apidata');

        // Get @grpc/grpc-js package object
        const packageObject = descriptor.getPackageObject({
            keepCase: true,
            enums: String,
            longs: String
        });

        // Connect with service packageObject.<packageName>.<serviceName>
        var proto = new packageObject.apidata.ApiKeyService(
            '0.0.0.0:3000',
            grpc.credentials.createInsecure()
        );

        // Execute rpc command
        proto.Add({"user_id":"A"}, metadata, (d)=>{
            console.log(d);
        });

        proto.ChekUser({"user_id":"A"}, metadata, (d)=>{
            console.log(d);
        });

    })();

}catch(e){
    console.log(e);
}

```

## Nodejs Grpc reflection server
If you want to use grpc reflection server in node use below package:
[https://github.com/papajuanito/grpc-node-server-reflection](https://github.com/papajuanito/grpc-node-server-reflection)