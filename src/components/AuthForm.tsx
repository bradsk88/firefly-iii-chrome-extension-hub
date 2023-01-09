import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  redirectUri: string
  onSubmit: (params: AuthInputParams) => void
}

const AuthForm = (props: Props) => {
  const { redirectUri: defaultRedirectUri, onSubmit } = props;

  const [baseURL, setBaseURL] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [redirectUri, _] = useState<string>(defaultRedirectUri);

  const [copyButtonText, setCopyButtonText] = useState("copy");

  const redirectUriInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setCopyButtonText("copy");
    }, 1000);
  }, [copyButtonText]);

  return (
    <>
      <form
        id="form"
        onSubmit={(e) => {
          e.preventDefault();

          const params = {
            authorizationEndpoint: `${(baseURL)}/oauth/authorize`,
            tokenEndpoint: `${(baseURL)}/oauth/token`,
            clientId,
            redirectUri,
          };
          onSubmit(params)
        }}
      >
        <fieldset>
          <legend>API Information</legend>
          <div>
            <label htmlFor="base_url">
              Firefly III URL
            </label>
            <input
              type="url"
              name="base_url"
              placeholder="https://firefly.local"
              size={40}
              form="form"
              required
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Client Config</legend>

          <div>
            <label htmlFor="client_id">Client ID</label>
            <input
              type="text"
              name="client_id"
              size={30}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
              }}
            />
          </div>

          <div>
            <label htmlFor="redirect_uri">redirect_uri</label>
            <input
              ref={redirectUriInputRef}
              type="text"
              id="redirect_uri"
              name="redirect_uri"
              value={redirectUri}
              readOnly
              size={50}
            />
            <button
              id="copy_redirect_uri_button"
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                redirectUriInputRef.current?.select();
                redirectUriInputRef.current?.setSelectionRange(0, 99999);
                document.execCommand("copy");

                setCopyButtonText("copied!");
              }}
            >
              {copyButtonText}
            </button>
          </div>
        </fieldset>

        <fieldset>
          {/* 
          <div>
            <input type="checkbox" id="use_curl" name="use_curl" disabled />
            <label htmlFor="use_curl">
              Show TokenRequest cURL command (not implemented yet...)
            </label>
          </div>
            */}
        </fieldset>

        <input type="submit" id="submit" value="Start Auth" />
      </form>
    </>
  );
};

export default AuthForm;