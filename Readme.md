# Title
Reflection client for Node/Typescript for @grpc/grpc-js. Working with @grpc/reflection server and other grpc nodejs servers.

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

### List services Without tls
```js
const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

/**
 * List services
 */
try {
    (async () => {
        const c = new GrpcReflection(
            '0.0.0.0:50051',
            grpc.ChannelCredentials.createInsecure(),
            // {
            //     "grpc.max_connection_age_ms": 10*1000,
            //     'grpc.keepalive_time_ms': 10 * 1000,
            //     // Keepalive ping timeout after 5 seconds, default is 20 seconds.
            //     'grpc.keepalive_timeout_ms': 5 * 1000,
            //     // Allow keepalive pings when there are no gRPC calls.
            //     'grpc.keepalive_permit_without_calls': 1,
            //     "grpc.initial_reconnect_backoff_ms": 1000,
            // }
        );
        console.log(await c.listServices());
    })();

}catch(e){
    console.log(e);
}

```

### List services with TLS
```js
const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

function getChannelCredentials() {
    return grpc.ChannelCredentials.createSsl();
}

try {
    (async()=> {
        const client = new GrpcReflection(
            'grpcb.in:9001',
            getChannelCredentials(),
        );
        console.log(await client.listServices());
    })();
}catch(e){
    console.log(e)
}
```

### List methods for service
```js
const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

function getChannelCredentials() {
    return grpc.ChannelCredentials.createSsl();
}

try {
    (async()=> {
        const client = new GrpcReflection(
            'grpcb.in:9001',
            getChannelCredentials(),
        );

        const methods = await client.listMethods('grpc.gateway.examples.examplepb.ABitOfEverythingService');
        console.log(methods.map(method => method.name));
    })();
}catch(e){
    console.log(e)
}
```

## Example client + server

#### 1. Server with @grpc/reflection
```js
cat <<EOF > server.js
const grpc = require('@grpc/grpc-js');
const { ReflectionService } = require('@grpc/reflection');
const protoLoader = require('@grpc/proto-loader');

const def_options =  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
};

const packageDefinition = protoLoader.loadSync(
    __dirname + 'addressbook.proto', // https://raw.githubusercontent.com/gawsoftpl/grpc-js-reflection-api-client/main/tests/protos/addressbook.proto
    def_options
);
const addressbook = grpc.loadPackageDefinition(packageDefinition)

// This wraps the instance of gRPC server with the Server Reflection service and returns it.
const server = new grpc.Server();

const reflection = new ReflectionService(packageDefinition);
reflection.addToServer(server);

server.addService(
    //@ts-ignore
    addressbook.addressbook.AddressesService.service, {
        Add: (_, callback) => {
            callback(null, {
                success: true,
                id: "123"
            });
        }
    }
)

server.bindAsync("127.0.0.1:3000", grpc.ServerCredentials.createInsecure(),() => {
    server.start();
    console.log("Server started on port 3000");
});
EOF
```

#### 2. Client with grpc-js-reflection-client
```js
cat <<EOF > client.js
const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

/**
 * Get proto descriptor from reflection grpc api and get in @grpc/grpc-js format
 *
 * */

const host = "127.0.0.1:3000"

try {
    (async()=>{
        // Connect with grpc server reflection
        const client = new GrpcReflection(host, grpc.ChannelCredentials.createInsecure());

        // Get services without proto file for specific symbol or file name
        const descriptor = await client.getDescriptorByFileName('addressbook.proto');

        // Create package services
        const packageObject = descriptor.getPackageObject({
            keepCase: true,
            enums: String,
            longs: String
        });

        // Send request over grpc
        const proto = new packageObject.addressbook.AddressesService(
            host,
            grpc.ChannelCredentials.createInsecure(),
        );

        proto.Add({
            name: "abc",
            email: "test@example.com"
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

#### 3. Run script
Run both commands in seperate terminal
```sh
node server.js
```
```sh
node client.js
```

## Helpers functions
You can use one line helpers function for simple download service from grpc reflection server and run client:
```js
const { serviceHelper } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

(async()=>{
    const proto = await serviceHelper({
        host: "localhost:50053",
        servicePath: "addressbook.AddressesService",
        credentials: grpc.ChannelCredentials.createInsecure(),
        proto_filename: 'addressbook.proto',
        protoLoaderOptions: {
            keepCase: true
        }
    })

    proto.Add({
        name: "abc",
        email: "test@example.com"
    }, (err, response) => {
        console.log(response)
    });
})();

```

## Tests

### Unit tests
```sh
npm run test
```

### E2E tests
```sh
bin/start-e2e-test-server.sh
npm run test:e2e
```

## Nodejs Grpc reflection server
If you want to use grpc reflection server in NodeJS/Typescript use below package:
[https://www.npmjs.com/package/@grpc/reflection](https://www.npmjs.com/package/@grpc/reflection)

## Proto bindings

Proto bindings were generated for v1 and v1alpha reflection using the following commands

```sh
sudo apt update
sudo apt install -y protobuf-compiler
npm install -g protoc-gen-ts
protoc -I=proto/ --ts_out=src/Proto v1.proto --ts_opt=json_names
protoc -I=proto/ --ts_out=src/Proto v1alpha.proto --ts_opt=json_names
```
