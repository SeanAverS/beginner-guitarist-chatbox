// This component: 
// handles a modal that confirms the deletion of a chosen chat

function ConfirmDeleteModal({ isOpen, chatTitle, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Deleting Chat "{chatTitle}"</h2>
        <p>Are you sure?</p>
        <div className="confirm-modal-buttons">
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
