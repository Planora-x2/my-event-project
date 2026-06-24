from rest_framework import serializers
from .models import PlanningChecklist, ChecklistItem, TimelineMilestone, Collection, CollectionItem, EventGroup, Collaborator

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = '__all__'
        read_only_fields = ['checklist']

class PlanningChecklistSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = PlanningChecklist
        fields = '__all__'
        read_only_fields = ['user']

class TimelineMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineMilestone
        fields = '__all__'
        read_only_fields = ['user']

class CollectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionItem
        fields = '__all__'
        read_only_fields = ['collection']

class CollectionSerializer(serializers.ModelSerializer):
    items = CollectionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = '__all__'
        read_only_fields = ['user']

class CollaboratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collaborator
        fields = '__all__'
        read_only_fields = ['group']

class EventGroupSerializer(serializers.ModelSerializer):
    collaborators = CollaboratorSerializer(many=True, read_only=True)

    class Meta:
        model = EventGroup
        fields = '__all__'
        read_only_fields = ['created_by']
