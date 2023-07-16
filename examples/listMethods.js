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
