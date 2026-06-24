from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlanningChecklistViewSet, ChecklistItemViewSet, TimelineMilestoneViewSet,
    CollectionViewSet, CollectionItemViewSet, EventGroupViewSet, CollaboratorViewSet
)

router = DefaultRouter()
router.register(r'checklists', PlanningChecklistViewSet, basename='planning-checklists')
router.register(r'checklist-items', ChecklistItemViewSet, basename='checklist-items')
router.register(r'timeline-milestones', TimelineMilestoneViewSet, basename='timeline-milestones')
router.register(r'collections', CollectionViewSet, basename='collections')
router.register(r'collection-items', CollectionItemViewSet, basename='collection-items')
router.register(r'groups', EventGroupViewSet, basename='event-groups')
router.register(r'collaborators', CollaboratorViewSet, basename='collaborators')

urlpatterns = [
    path('', include(router.urls)),
]
