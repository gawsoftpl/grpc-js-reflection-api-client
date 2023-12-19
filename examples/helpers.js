const { serviceHelper } = require('../');
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
