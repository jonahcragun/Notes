import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaTrash, FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa'

function App() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [listHidden, setListHidden] = useState(false);

    // sort notes
    const handleSetNotes = (notesArr) => {
        setNotes([...notesArr].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
    }

    useEffect(() => {
        axios.get("http://localhost:8000")
            .then((response) => {
                handleSetNotes(response.data.payload);
            })
            .catch((error) => {
                console.error('error: ', error);
            });
    }, []);

    const addNote = () => {
        axios.post("http://localhost:8000/note", { 'title': "", 'content': "" })
            .then((response) => {
               handleSetNotes([...notes, response.data]);
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
        handleSetNotes([...notes]);
    }

    const toggleListHidden = () => {
        setListHidden(!listHidden);
    }

    return (
        <div className="App">
            <Menu listHidden={listHidden} onToggleListHidden={toggleListHidden} /> 
            <div className="Container">
                <NoteListPane notes={notes} listHidden={listHidden} selectedNote={selectedNote} onSelectNote={selectNote} onAddNote={addNote} onDeleteNote={deleteNote}/>
                <NoteViewPane selectedNote={selectedNote} notes={notes} onUpdateNotes={updateNotes} />
            </div>
        </div>
    );
}

// Top Menu
const Menu = ({ listHidden, onToggleListHidden }) => {
    return (
        <div className="Menu">
            <button className="MenuButton" title={listHidden ? "Show List" : "Hide List"} onClick={onToggleListHidden}>
                {listHidden ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
            <h1>Notes</h1>
            <button className="MenuButton"><FaUser /></button>
        </div>
    );
}

// left pane
const NoteListPane = ({ notes, listHidden, selectedNote, onSelectNote, onAddNote, onDeleteNote }) => {

    return (
    <>
        {!listHidden && 
            <div className="NoteListPane">
                <div className="NotesHeader">
                    <h2 className="NotesHeaderElement1">Files</h2>
                    <button title="Create New Note" className="AddNoteButton" onClick={onAddNote}>+</button>
                </div>
                <NoteListBody notes={notes} onDeleteNote={onDeleteNote} selectedNote={selectedNote} onSelectNote={onSelectNote} />
            </div>
        }
    </>
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
            {notes.map((note, index) => (
                <li className={selectedNote !== note.id ? "NoteListItem" : "SelectedNote"} onClick={() => onSelectNote(note.id)} onMouseEnter={() => onNoteHovered(index)} onMouseLeave={offNoteHovered} key={index}>
                    <div>
                        <p className="NoteItemTitle">{note.title}</p>
                        <p className="NoteItemLastUpdated">{format(new Date(note.updated_at), 'MM/dd/yy')}</p>
                    </div>
                    {noteHovered === index ? <button title="Delete Note" className="DeleteButton" onClick={(event) => onDeleteNote(note.id, event)}><FaTrash /></button> : null}
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
    const selectFlag = useRef(true);
    const [title, setTitle] = useState(notes.find((note) => note.id === selectedNote).title);
    const [content, setContent] = useState('');
    const titleDebounce = useDebounce(title, 500) // delay of 500ms
    const contentDebounce = useDebounce(content, 500) // delay of 500ms

    // update note view when selectedNote changes
    useEffect( () => {
        selectFlag.current = true;
        setTitle(notes.find((note) => note.id === selectedNote).title);
        setContent(notes.find((note) => note.id === selectedNote).content);
    }, [selectedNote]);

    // save title to database once user stops typing for specified delay length of time
    useEffect(() => {
        // auto save when title is changed
        if (!selectFlag.current) {
            axios.put(`http://localhost:8000/note/update/title/${selectedNote}/`, {'title': titleDebounce})
                .then((response) => {
                    const note = notes.find((note) => note.id === selectedNote);
                    note.updated_at = response.data.updated_at;
                    onUpdateNotes(notes);
                })
                .catch((error) => console.error('error: ', error)
            );
        }
    }, [titleDebounce]);

    // handle title change
    const updateTitle = (event) => {
        setTitle(event.target.value);

        // update notes list ui
        const note = notes.find((note) => note.id === selectedNote);
        note.title = event.target.value;
        onUpdateNotes(notes);
    }

    // save content to database once user stops typing for specified delay length of time
    useEffect(() => {
        // auto save when content is changed
        if (!selectFlag.current) {
            console.log(contentDebounce);
            axios.put(`http://localhost:8000/note/update/content/${selectedNote}/`, {'content': contentDebounce})
                .then((response) => {
                    const note = notes.find((note) => note.id === selectedNote);
                    note.content = response.data.content;
                    note.updated_at = response.data.updated_at;
                    onUpdateNotes(notes);
                })
                .catch((error) => console.error('error: ', error)
            );
        }
        selectFlag.current = false;
    }, [contentDebounce]);

    // handle content change
    const updateContent = (event) => {
        setContent(event.target.value);
    }

    return (
        <div className="NoteEditor">
            <input className="TitleInput" type="text" value={title} placeholder="Title" onChange={updateTitle} />
            <textarea className="ContentInput" value={content} placeholder="Text..." onChange={updateContent} />
        </div>
    );
}

const useDebounce = (value, delay) => {
    const [debounceValue, setDebounceValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebounceValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounceValue;
}

export default App;
