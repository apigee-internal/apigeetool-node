'use strict';

module.exports.rootXmlTemplate = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> \
<APIProxy revision="1" name="{{api}}"> \
    <ConfigurationVersion majorVersion="4" minorVersion="0"/> \
    <DisplayName>{{api}}</DisplayName> \
    <Policies> \
        <Policy>GetTurboConfig</Policy> \
        <Policy>GenerateTurboRequest</Policy> \
    </Policies> \
    <ProxyEndpoints> \
        <ProxyEndpoint>default</ProxyEndpoint> \
    </ProxyEndpoints> \
    <Resources> \
        <Resource>jsc://gen-target-url.js</Resource> \
    </Resources> \
    <TargetServers/> \
    <TargetEndpoints> \
        <TargetEndpoint>default</TargetEndpoint> \
    </TargetEndpoints> \
</APIProxy>'

module.exports.defaultTargetTemplate = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> \
<TargetEndpoint name="default"> \
    <Description/> \
    <FaultRules/> \
    <PreFlow name="PreFlow"> \
        <Request> \
            <Step> \
                <Name>GenerateTurboRequest</Name> \
            </Step> \
        </Request> \
        <Response/> \
    </PreFlow> \
    <PostFlow name="PostFlow"> \
        <Request/> \
        <Response/> \
    </PostFlow> \
    <Flows/> \
    <HTTPTargetConnection> \
        <Properties/> \
        <!-- Dummy endpoint that will be replaced by the GenerateTurboRequest policy --> \
        <URL>https://{{api}}-dot-{{organization}}.appspot.com/</URL> \
    </HTTPTargetConnection> \
</TargetEndpoint>'

module.exports.genTurboReqjs = `// Fallback region for Turbo
var defaultRegion = 'us-central';
// Get MP region and map to a turbo gae region
var edgeRegion = context.getVariable('system.region.name');
var turboRegion = mapRegion(edgeRegion);

// Locate region mapping in KVM, fallback to default region
var projectId = context.getVariable('turbo-region-' + turboRegion) || context.getVariable('turbo-region-' + defaultRegion);
if (projectId === '') {
    throw new Error("Turbo project id was not found in KVM")
}

// Use proxy name as the deployment name
var appName = context.getVariable('apiproxy.name');

// Generate a target url using the appName and projectId and request path?query
var targetUrl = 'https://' + appName + '-dot-' + projectId + '.appspot.com';
targetUrl += context.getVariable('request.path');
if (context.getVariable('request.querystring') !== "") {
    targetUrl += '?' + context.getVariable('request.querystring');
}

// Set the new target url
context.setVariable('target.url', targetUrl);
// Set the routing key from the KVM
context.setVariable("request.header.x-routing-api-key", context.getVariable('turbo-routing-key'));

// Map a EC2/GCE region into a turbo GAE region
function mapRegion(region) {
    if (region === 'us-east1' ||
        region === 'us-east-1' ||
        region === 'us-east-2') {
        return 'us-east1';
    } else if (region === 'us-central' ||
               region === 'us-west-1' ||
               region === 'us-west-2' ||
               region === 'ca-central-1') {
        return 'us-central';
    } else if (region === 'asia-northeast1' ||
               region === 'ap-south-1' ||
               region === 'ap-northeast-2' ||
               region === 'ap-southeast-1' ||
               region === 'ap-southeast-2' ||
               region === 'ap-northeast-1' ||
               region === 'asia-east1' ||
               region === 'asia-northeast1' ) {
        return 'asia-northeast1';
    } else if (region === 'europe-west' ||
               region === 'eu-central-1' ||
               region === 'eu-west-1' ||
               region === 'eu-west-2' ||
               region === 'europe-west1') {
        return 'europe-west';
    } else {
        return 'us-central';
    }
}`

module.exports.defaultProxyTemplate = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ProxyEndpoint name="default">
    <Description/>
    <FaultRules/>
    <PreFlow name="PreFlow">
        <Request/>
        <Response/>
    </PreFlow>
    <PostFlow name="PostFlow">
        <Request>
            <Step>
                <Name>GetTurboConfig</Name>
            </Step>
        </Request>
        <Response/>
    </PostFlow>
    <Flows/>
    <HTTPProxyConnection>
        <BasePath>/{{basepath}}</BasePath>
        <Properties/>
        <VirtualHost>default</VirtualHost>
        <VirtualHost>secure</VirtualHost>
    </HTTPProxyConnection>
    <RouteRule name="default">
        <TargetEndpoint>default</TargetEndpoint>
    </RouteRule>
</ProxyEndpoint>`

module.exports.getTurboConfig = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<KeyValueMapOperations mapIdentifier="turbo-config" async="false" continueOnError="false" enabled="true" name="GetTurboConfig">
    <DisplayName>GetTurboConfig</DisplayName>
    <Scope>environment</Scope>
    <Get assignTo="turbo-routing-key" index="1">
        <Key>
            <Parameter>routing:key</Parameter>
        </Key>
    </Get>
    <Get assignTo="turbo-region-us-central" index="1">
        <Key>
            <Parameter>project:id:us-central</Parameter>
        </Key>
    </Get>
    <Get assignTo="turbo-region-us-east1" index="1">
        <Key>
            <Parameter>project:id:us-east1</Parameter>
        </Key>
    </Get>
    <Get assignTo="turbo-region-europe-west" index="1">
        <Key>
            <Parameter>project:id:europe-west</Parameter>
        </Key>
    </Get>
    <Get assignTo="turbo-region-asia-northeast1" index="1">
        <Key>
            <Parameter>project:id:asia-northeast1</Parameter>
        </Key>
    </Get>
</KeyValueMapOperations>`

module.exports.genTurboReqPolicy = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Javascript async="false" continueOnError="false" enabled="true" timeLimit="200" name="GenerateTurboRequest">
    <DisplayName>GenerateTurboRequest</DisplayName>
    <Properties/>
    <ResourceURL>jsc://gen-turbo-req.js</ResourceURL>
</Javascript>
`