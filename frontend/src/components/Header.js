// This component: 
// Displays the header and toggles the display of the sidebar 

function Header({ handleSidebarToggle }) {
  return (
    <header className="App-header">
      <button onClick={handleSidebarToggle} title="Open Saved Chats">
        <i className="fa-solid fa-bars"></i>
      </button>
      <h1>Beginner Guitar Advice</h1>
    </header>
  );
}

export default Header;
