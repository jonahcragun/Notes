import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

function App() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:8000")
            .then((response) => {
                setNotes(response.data.payload);
            })
            .catch((error) => {
                console.error('error: ', error);
            });
    }, []);

    const addNote = () => {
        axios.post("http://localhost:8000/note", { 'title': "", 'content': "" })
            .then((response) => {
               setNotes([...notes, response.data]);
               setSelectedNote(response.data.id);
            })
            .catch((error) => {
                console.error('error: ', error);
            });
    }

    const deleteNote = (pk, event) => {
        // stop event from selecting list element when containing delete
        event.stopPropagation();

        axios.delete(`http://localhost:8000/note/delete/${pk}/`)
            .then((response) => {
                setNotes(notes.filter((note) => note.id !== pk));
                if (selectedNote === pk) {
                    setSelectedNote(null);
                }
            })
            .catch((error) => {
                console.error('error: ', error);
            });
    }

    const selectNote = (key) => {
        setSelectedNote(key);
    }

    const updateNotes = (notes) => {
        setNotes([...notes]);
    }

    return (
        <div className="App">
            <div className="Menu">
                <button>hide</button>
                <button>user</button>
            </div>
            <div className="Container">
                <NoteListPane notes={notes} selectedNote={selectedNote} onSelectNote={selectNote} onAddNote={addNote} onDeleteNote={deleteNote}/>
                <NoteViewPane selectedNote={selectedNote} notes={notes} onUpdateNotes={updateNotes} />
            </div>
        </div>
    );
}

// left pane
const NoteListPane = ({ notes, selectedNote, onSelectNote, onAddNote, onDeleteNote }) => {

    return (
        <div className="NoteListPane">
            <div className="NotesHeader">
                <h1 className="NotesHeaderElement1">Notes</h1>
                <button className="AddNoteButton" onClick={onAddNote}>+</button>
            </div>
            <NoteListBody notes={notes} onDeleteNote={onDeleteNote} selectedNote={selectedNote} onSelectNote={onSelectNote} />
        </div>
    );
}

const NoteListBody = ({ notes, selectedNote, onSelectNote, onDeleteNote }) => (
    <div className="NoteListBody">
        {notes.length !== 0 ? <NoteList notes={notes} onDeleteNote={onDeleteNote} selectedNote={selectedNote} onSelectNote={onSelectNote} /> : (<div className="NotFound"><p>No Notes Yet.</p></div>)}
    </div>
);

const NoteList = ({ notes, selectedNote, onSelectNote, onDeleteNote }) => {
    const [noteHovered, setNoteHovered] = useState(null);

    const onNoteHovered = (key) => setNoteHovered(key);
    const offNoteHovered = () => setNoteHovered(null);

    return (
        <ul className="NoteList">
            {[...notes].sort((a, b) => a.updated_at - b.updated_at).reverse().map((note, index) => (
                <li className={selectedNote !== note.id ? "NoteListItem" : "SelectedNote"} onClick={() => onSelectNote(note.id)} onMouseEnter={() => onNoteHovered(index)} onMouseLeave={offNoteHovered} key={index}>
                    <div>
                        <p className="NoteItemTitle">{note.title}</p>
                        <p className="NoteItemLastUpdated">{format(new Date(note.updated_at), 'MM/dd/yy')}</p>
                    </div>
                    {noteHovered === index ? <button className="DeleteButton" onClick={(event) => onDeleteNote(note.id, event)}>delete</button> : null}
                </li>
            ))}
        </ul>
    );
}

// right pane
const NoteViewPane = ({ selectedNote, notes, onUpdateNotes }) => (
    <div className="NoteViewPane">
        {selectedNote !== null ? <NoteEditor selectedNote={selectedNote} notes={notes} onUpdateNotes={onUpdateNotes} /> : <div className="NotFound"><p>No Note Selected.</p></div>}
    </div>
);

const NoteEditor = ({ selectedNote, notes, onUpdateNotes }) => {
    const [title, setTitle] = useState(notes.find((note) => note.id === selectedNote).title);
    const [content, setContent] = useState('');

    // update note view when selectedNote changes
    useEffect( () => {
        setTitle(notes.find((note) => note.id === selectedNote).title);
        setContent(notes.find((note) => note.id === selectedNote).content);
    }, [selectedNote]);

    // handle title change
    const updateTitle = (event) => {
        setTitle(event.target.value);

        // update notes list ui
        const note = notes.find((note) => note.id === selectedNote);
        note.title = event.target.value;
        onUpdateNotes(notes);

        // auto save when title is changed
        axios.put(`http://localhost:8000/note/update/title/${selectedNote}/`, {'title': event.target.value})
            .catch((error) => console.error('error: ', error)
        );
    }

    // handle content change
    const updateContent = (event) => {
        setContent(event.target.value);

        // auto save when content is changed
        axios.put(`http://localhost:8000/note/update/content/${selectedNote}/`, {'content': event.target.value})
            .then((request) => {
                const note = notes.find((note) => note.id === selectedNote);
                note.content = request.data.content;
                onUpdateNotes(notes);
            })
            .catch((error) => console.error('error: ', error)
        );
    }

    return (
        <div className="NoteEditor">
            <input className="TitleInput" type="text" value={title} placeholder="Title" onChange={updateTitle} />
            <textarea className="ContentInput" value={content} placeholder="Text..." onChange={updateContent} />
        </div>
    );
}

export default App;
