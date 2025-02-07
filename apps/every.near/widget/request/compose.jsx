if (!context.accountId) {
  return "";
}

const indexKey = props.indexKey ?? "main";
const draftKey = props.indexKey ?? "draft";
const draft = Storage.privateGet(draftKey);
const includedHashtags = props.includedHashtags ?? [];
const groupId = props.groupId;

if (draft === null) {
  return "";
}

const [initialText] = useState(draft);

const contentWithHashtags = () => {
  const content = state.content;
  // push new line and hashtags
  content.text = content.text + "\n\n";
  includedHashtags.forEach((hashtag) => {
    if (content.text.indexOf("#" + hashtag) === -1) {
      content.text = content.text + "#" + hashtag + " ";
    }
  });

  return content;
};

const composeData = () => {
  const content = contentWithHashtags();

  const data = {
    post: {
      main: JSON.stringify(Object.assign({ groupId }, content)),
    },
    index: {
      post: JSON.stringify({
        key: indexKey,
        value: {
          type: "md",
        },
      }),
    },
  };

  const item = {
    type: "social",
    path: `${context.accountId}/post/main`,
  };

  const notifications = state.extractMentionNotifications(content.text, item);

  if (notifications.length) {
    data.index.notify = JSON.stringify(
      notifications.length > 1 ? notifications : notifications[0]
    );
  }

  const hashtags = state.extractHashtags(content.text);

  if (hashtags.length) {
    data.index.hashtag = JSON.stringify(
      hashtags.map((hashtag) => ({
        key: hashtag,
        value: item,
      }))
    );
  }

  return data;
};

State.init({
  onChange: ({ content }) => {
    State.update({ content });
    Storage.privateSet(draftKey, content.text || "");
  },
});

return (
  <>
    <div style={{ margin: "0 -12px" }}>
      <Widget
        src="mob.near/widget/MainPage.N.Common.Compose"
        props={{
          placeholder: "What's happening?",
          onChange: state.onChange,
          initialText,
          onHelper: ({ extractMentionNotifications, extractHashtags }) => {
            State.update({ extractMentionNotifications, extractHashtags });
          },
          composeButton: (onCompose) => (
            <CommitButton
              disabled={!state.content}
              force
              className="btn btn-primary rounded-5"
              data={composeData}
              onCommit={() => {
                onCompose();
              }}
            >
              Post
            </CommitButton>
          ),
        }}
      />
    </div>
    {state.content && (
      <Widget
        key="post-preview"
        src="mob.near/widget/MainPage.N.Post"
        props={{
          accountId: context.accountId,
          content: state.content,
          blockHeight: "now",
        }}
      />
    )}
  </>
);
