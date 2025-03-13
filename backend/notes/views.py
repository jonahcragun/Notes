from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *

# get all notes 
@api_view(['GET'])
def get_notes(request):
    notes = Note.objects.all()
    serializer = NoteSerializer(notes, many=True)
    return Response({'status': 200, 'payload': serializer.data})

# add new note
@api_view(['POST'])
def create_note(request):
    serializer = NoteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(status=status.HTTP_400_BAD_REQUEST)

# get note content for particular pk
@api_view(['GET'])
def get_note(request, pk):
    try:
        note = Note.objects.get(pk=pk)
    except:
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = NoteSerializer(note)
    return Response({'status': 200, 'payload': serializer.data})

# modify note content for particular pk
@api_view(['PUT'])
def update_note_content(request, pk):
    try:
        note = Note.objects.get(pk=pk)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    note.content = request.data['content']
    note.save()
    serializer = NoteSerializer(note)
    return Response(serializer.data, status=status.HTTP_200_OK)

# update note title in db
@api_view(['PUT'])
def update_note_title(request, pk):
    try: 
        note = Note.objects.get(pk=pk)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    note.title = request.data['title']
    note.save()
    serializer = NoteSerializer(note)
    return Response(serializer.data, status=status.HTTP_200_OK)

# delete note
@api_view(['DELETE'])
def delete_note(request, pk):
    try: 
        note = Note.objects.get(pk=pk)
    except:
        return Response(status=status.HTTP_404_NOT_FOUND)
    note.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
