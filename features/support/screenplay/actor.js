export class Actor {
  constructor(name, world) {
    this.name = name
    this.world = world
  }

  get page() {
    return this.world.page
  }

  async attemptsTo(...tasks) {
    for (const task of tasks) {
      await task.performAs(this)
    }
  }

  async asksFor(question) {
    return question.answeredBy(this)
  }

  remember(key, value) {
    if (!this.world.screenplayMemory) this.world.screenplayMemory = new Map()
    this.world.screenplayMemory.set(`${this.name}:${key}`, value)
  }

  recall(key) {
    return this.world.screenplayMemory?.get(`${this.name}:${key}`)
  }
}

export function actorCalled(world, name) {
  if (!world.screenplayActors) world.screenplayActors = new Map()
  if (!world.screenplayActors.has(name)) {
    world.screenplayActors.set(name, new Actor(name, world))
  }
  world.currentActorName = name
  return world.screenplayActors.get(name)
}

export function currentActor(world, expectedName) {
  const name = expectedName ?? world.currentActorName
  const actor = name ? world.screenplayActors?.get(name) : null
  if (!actor) {
    throw new Error(`No Screenplay actor is active${expectedName ? ` for ${expectedName}` : ''}.`)
  }
  return actor
}
