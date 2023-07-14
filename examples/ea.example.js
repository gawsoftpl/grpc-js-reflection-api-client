const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

function getChannelCredentials() {
    return grpc.ChannelCredentials.createSsl();
}
try {
    (async()=> {
        const client = new GrpcReflection(
            'gateway.grpc.int.ea.com:443',
            getChannelCredentials(),
            {
                "grpc.max_connection_age_ms": 10*1000,
                'grpc.keepalive_time_ms': 10 * 1000,
                // Keepalive ping timeout after 5 seconds, default is 20 seconds.
                'grpc.keepalive_timeout_ms': 5 * 1000,
                // Allow keepalive pings when there are no gRPC calls.
                'grpc.keepalive_permit_without_calls': 1,
                "grpc.initial_reconnect_backoff_ms": 1000,
            }
        );
        console.log(await client.listServices());
    })();
}catch(e){
    console.log(e)
}
