import * as grpc from '@grpc/grpc-js';
import { ReflectionService } from '@grpc/reflection';
import * as protoLoader from '@grpc/proto-loader';

const def_options =  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
};

const packageDefinition = protoLoader.loadSync(
    __dirname + '/../../protos/addressbook.proto',
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


server.bindAsync("127.0.0.1:50053", grpc.ServerCredentials.createInsecure(),() => {
    console.log("Server started on port 50053");
});


// Since the wrapped server intercepts the `addService` method to keep track
// of all services added to the server make sure to add your services after
// wrapping your instance of the gRPC Server.
//server.addService()