const note_buttons = document.querySelectorAll('.note-btn');

note_buttons.forEach(btn => btn.classList.remove('active-note'));

note_buttons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains('active-note')) {
            button.classList.remove('active-note');
            console.log('Released:', button.id);
        } else {
            note_buttons.forEach(btn => btn.classList.remove('active-note'));
            button.classList.add('active-note');
            console.log('Pressed:', button.id);
        }
    });
});
