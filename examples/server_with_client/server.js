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
    __dirname + '../../../tests/protos/addressbook.proto', // https://raw.githubusercontent.com/gawsoftpl/grpc-js-reflection-api-client/main/tests/protos/addressbook.proto
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