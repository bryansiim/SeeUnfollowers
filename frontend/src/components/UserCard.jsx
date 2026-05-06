export default function UserLink({ username }) {
  return (
    <a
      href={`https://www.instagram.com/${username}`}
      target="_blank"
      rel="noreferrer"
      className="userlink"
    >
      <span className="userlink__at">@</span>
      <span>{username}</span>
    </a>
  );
}
