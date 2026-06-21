from app.services import (
    DependencyTreeService,
    DependencyGraphService
)

tree = (
    DependencyTreeService
    .get_tree(
        r"D:\test_project"
    )
)

graph = (
    DependencyGraphService
    .build_real_graph(
        tree
    )
)

print(graph)