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
