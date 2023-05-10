import * as grpc from '@grpc/grpc-js';
import wrapServerWithReflection from 'grpc-node-server-reflection';
import * as protoLoader from '@grpc/proto-loader';

const def_options =  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
};

const addressbook = grpc.loadPackageDefinition(
    protoLoader.loadSync(
        __dirname + '/../../protos/addressbook.proto',
        def_options
));


// This wraps the instance of gRPC server with the Server Reflection service and returns it.
const server = wrapServerWithReflection(new grpc.Server());

server.addService(
    //@ts-ignore
    addressbook.tutorial.AddressesService.service, {
        Add: (_, callback) => {
            callback(null, {
                success: true,
                id: "123"
            });
        }
    }
)


server.bindAsync("127.0.0.1:50052", grpc.ServerCredentials.createInsecure(),() => {
    server.start();
    console.log("Server started on port 50052");
});


// Since the wrapped server intercepts the `addService` method to keep track
// of all services added to the server make sure to add your services after
// wrapping your instance of the gRPC Server.
//server.addService()