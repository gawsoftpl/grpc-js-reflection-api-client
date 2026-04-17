import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ReflectionService } from '@grpc/reflection';

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


server.bindAsync("127.0.0.1:50052", grpc.ServerCredentials.createInsecure(),() => {
    console.log("Server started on port 50052");
});


// Since the wrapped server intercepts the `addService` method to keep track
// of all services added to the server make sure to add your services after
// wrapping your instance of the gRPC Server.
//server.addService()