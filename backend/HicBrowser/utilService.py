import uuid


def generate_session():
    id = str(uuid.uuid1())
    print(id)
    return id
