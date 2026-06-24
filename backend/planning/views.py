from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PlanningChecklist, ChecklistItem, TimelineMilestone, Collection, CollectionItem, EventGroup, Collaborator
from .serializers import (
    PlanningChecklistSerializer, ChecklistItemSerializer, TimelineMilestoneSerializer,
    CollectionSerializer, CollectionItemSerializer, EventGroupSerializer, CollaboratorSerializer
)

class PlanningChecklistViewSet(viewsets.ModelViewSet):
    serializer_class = PlanningChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PlanningChecklist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        checklist = self.get_object()
        serializer = ChecklistItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(checklist=checklist)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class ChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChecklistItem.objects.filter(checklist__user=self.request.user)

class TimelineMilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = TimelineMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TimelineMilestone.objects.filter(user=self.request.user).order_by('due_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        collection = self.get_object()
        serializer = CollectionItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(collection=collection)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class CollectionItemViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CollectionItem.objects.filter(collection__user=self.request.user)

class EventGroupViewSet(viewsets.ModelViewSet):
    serializer_class = EventGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return EventGroup.objects.filter(
            Q(created_by=self.request.user) | Q(collaborators__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_collaborator(self, request, pk=None):
        group = self.get_object()
        serializer = CollaboratorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(group=group)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class CollaboratorViewSet(viewsets.ModelViewSet):
    serializer_class = CollaboratorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return Collaborator.objects.filter(
            Q(group__created_by=self.request.user) | Q(user=self.request.user)
        )
