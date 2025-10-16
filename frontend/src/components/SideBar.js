// src/components/Sidebar.js
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

// This component: 
// displays all the saved chats in a collapsable sidebar
// displays the chat title with an edit and delete button
// displays the editing chat title state
// handles the new chat title thats displayed after editing 
function Sidebar({
  savedChats,
  chatFilename,
  isSidebarOpen,
  sidebarRef,
  handleLoadChat,
  handleRenameChat,
  handleDeleteChat,
}) {

  const [modalOpen, setModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const confirmDelete = (chat) => {
    setChatToDelete(chat);
    setModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (chatToDelete) handleDeleteChat(chatToDelete.filename);
    setModalOpen(false);
    setChatToDelete(null);
  };

  const handleCancelDelete = () => {
    setModalOpen(false);
    setChatToDelete(null);
  };

  const [editingFilename, setEditingFilename] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  // handle new chat title 
  const startRename = (filename, currentTitle) => {
    setEditingFilename(filename);
    setNewTitle(currentTitle);
  };

  // send new title to backend
  const submitRename = async (e, filename) => {
    e.preventDefault();
    if (newTitle.trim()) {
      await handleRenameChat(filename, newTitle);
    }
    setEditingFilename(null);
    setNewTitle("");
  };

  const isBeingEdited = (chatFilename) => editingFilename === chatFilename;

  return (
    // collapsable sidebar
    <div ref={sidebarRef} className={`sidebar ${isSidebarOpen ? "open" : ""}`}> 
      <div className="saved-chats-content">
        <h2>Saved Chats</h2>
        <ul>
            {/* display saved chats in sidebar */}
          {savedChats.map((chat) => {
            const beingEdited = isBeingEdited(chat.filename);

            let chatContent;

            if (beingEdited) { // editing mode
              chatContent = (
                <form
                  onSubmit={(e) => submitRename(e, chat.filename)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={(e) => submitRename(e, chat.filename)}
                    autoFocus
                  />
                </form>
              );
            } else { // non-editing display
              chatContent = (
                <div className="chat-item-content">
                  <span title={chat.chatTitle}>{chat.chatTitle}</span>

                  {/* rename chat button */}
                  <button
                    className="rename-button"
                    title="Rename Chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(chat.filename, chat.chatTitle);
                    }}
                  >
                    <i className="fa-solid fa-ellipsis"></i>
                  </button>
                  
                  {/* delete chat button */}
                  <button
                    className="delete-button"
                    title="Delete Chat"
                    onClick={(e) => {
                    e.stopPropagation();setChatToDelete(chat); 
                    setModalOpen(true);    
                  }}
                  >
                    <i className="fa-solid fa-x"></i>
                  </button>
                </div>
              );
            }

            return (
              <li
                key={chat.filename}
                // load chat only if its not being edited 
                onClick={
                  beingEdited ? null : () => handleLoadChat(chat.filename)
                }

                // style current chat
                className={chat.filename === chatFilename ? "active" : ""}
              >
                {chatContent}
              </li>
            );
          })}
        </ul>
        
      <ConfirmDeleteModal
      isOpen={modalOpen}
      chatTitle={chatToDelete?.chatTitle}
      onConfirm={handleConfirmDelete}
      onCancel={handleCancelDelete}
      />
      </div>
    </div>
  );
}

export default Sidebar;
