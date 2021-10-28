import React, { useEffect, useRef, useState } from "react";

const Retool = ({ data, url }) => {
  const embeddedIframe = useRef(null);
  const [elementWatchers, setElementWatchers] = useState({});

  useEffect(() => {
    for (const key in elementWatchers) {
      const watcher = elementWatchers[key];
      watcher.iframe?.contentWindow.postMessage(
        {
          type: "PARENT_WINDOW_RESULT",
          result: data[watcher.selector],
          id: watcher.queryId,
          pageName: watcher.pageName,
        },
        "*"
      );
    }
  }, [data, elementWatchers]);

  useEffect(() => {
    const handler = (event) => {
      if (!embeddedIframe?.current?.contentWindow) return;
      if (event.data.type === "PARENT_WINDOW_QUERY") {
        createOrReplaceWatcher(
          event.data.selector,
          event.data.pageName,
          event.data.id
        );
        postMessageForSelector("PARENT_WINDOW_RESULT", event.data);
      }
    };

    window.addEventListener("message", handler);

    // clean up
    return () => window.removeEventListener("message", handler);
  }, []);

  const createOrReplaceWatcher = (selector, pageName, queryId) => {
    const watcherId = pageName + "-" + queryId;
    const updatedState = elementWatchers;

    updatedState[watcherId] = {
      iframe: embeddedIframe.current,
      selector: selector,
      pageName: pageName,
      queryId: queryId,
    };

    setElementWatchers(updatedState);
  };

  const postMessageForSelector = (messageType, eventData) => {
    const maybeData = data[eventData.selector];

    if (maybeData) {
      embeddedIframe.current.contentWindow.postMessage(
        {
          type: messageType,
          result: maybeData,
          id: eventData.id,
          pageName: eventData.pageName,
        },
        "*"
      );
    } else {
      console.log(
        `Not sending data back to Retool, nothing found for selector: ${eventData.selector}`
      );
    }
  };

  return (
    <iframe
      height="100%"
      width="100%"
      frameBorder="none"
      src={url}
      ref={embeddedIframe}
      title="retool"
    ></iframe>
  );
};

export default Retool;
