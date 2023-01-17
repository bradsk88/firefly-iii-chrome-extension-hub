import * as React from 'react'
import { useRef, useState, useEffect } from 'react';
import AuthForm from './AuthForm';
import Hub from "./Hub";

const Initialize = () => {
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`

  const [baseURL, setBaseURL] = useState<string>("")
  const [log, setLog] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const logRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log(message);

      if (message.action === "log") {
        setLog((prev) => {
          return prev + message.value + "\n";
        });
        logRef.current?.scrollTo(0, logRef.current.scrollHeight);
      } else if (message.action === "result") {
        setResult(message.value);
      }

      return true;
    });

    return () => {
      chrome.runtime.onMessage.removeListener(() => {});
    }
  }, []);

  return (
    <>
        {!result &&
            <AuthForm
                redirectUri={redirectUri}
                onSubmit={(params) => {
                    setLog("");
                    setResult("");

                    chrome.runtime.sendMessage(
                        {
                            action: "submit",
                            value: params,
                        },
                        () => {
                        }
                    );
                }}
            />
        }
        {!!result &&
            <Hub />
        }
    </>
  );
}

export default Initialize