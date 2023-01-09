declare type OAuthMetaData = {
    issuer: string;
    authorizationEndpoint: string | null;
    tokenEndpoint: string | null;
    jwksUri?: string;
    registrationEndpoint?: string;
    scopesSupported?: string[];
    responseTypesSupported: string[];
    responseModesSupporteds?: string[]; // If omitted, the default is "["query", "fragment"]"
    grantTypesSupported?: string[]; // If omitted, the default value is "["authorization_code", "implicit"]"
    serviceDocumentation?: string;
    uiLocalesSupported?: string[];
    opPolicyUri?: string;
    opTosUri?: string;
    revocationEndpoint?: string;
    revocationEndpointAuthMethodsSupported?: string[];
    revocationEndpointAuthSigningAlgValuesSupported?: string[];
    introspectionEndpoint?: string;
    introspectionEndpointAuthMethodsSupported?: string[];
    introspectionEndpointAuthSigningAlgValuesSupported?: string[];
}

declare type AuthInputParams = {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    clientId: string;
    redirectUri: string;
};