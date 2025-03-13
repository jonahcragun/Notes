from django.urls import path
from .views import *

urlpatterns = [
    path('', get_notes),
    path('note', create_note),
    path('note/<int:pk>/', get_note),
    path('note/update/content/<int:pk>/', update_note_content),
    path('note/update/title/<int:pk>/', update_note_title),
    path('note/delete/<int:pk>/', delete_note),
]
