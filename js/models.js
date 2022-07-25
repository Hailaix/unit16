"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // makes a new URL object to easily extract the hostname
    const urlURL = new URL(this.url);
    return urlURL.hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory( user, newStory) {
    /*  try to send a post request to https://hack-or-snooze-v3.herokuapp.com/stories,
     * which includes a token and an object with title author url. 
     * the request should return either an error or a story object.
     */
    try {
      const res = await axios.post( `${BASE_URL}/stories`, {
        token : user.loginToken,
        story : newStory
      });
      console.log(res);
      //create a Story object from the response
      const returnstory = new Story(res.data.story);
      //add it to the front of story list
      this.stories.unshift(returnstory);
      //add it to the current user's ownStories array
      user.ownStories.push(returnstory);
      //and return the new story.
      return returnstory;
    } catch(e) {
      //no real error handling for now.
      console.log(e);
      return e;
    }
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /** Favorite or unfavorite a story 
   * story is a Story object
   * we dont just use the storyId because we want to update the User's favorite list without
   * having to reload the page.
   * checks the user's favorites list and sends either a POST or a DELETE,
   * depending on if story is in the users favorites list
   * returns a String on success, undefined otherwise.
  */
  async favoriteStory(story) {
    /**if there is a story in the user's favorites that has the same storyId
     * then we need to DELETE the favorite from the user, otherwise, we POST it as
     * a new favorite.
     */
    let method = "POST";
    /** we use findIndex and save it here to splice it from the array if we find it */
    const favIdx = this.favorites.findIndex(favorite => favorite.storyId === story.storyId);
    console.log(favIdx);
    if(favIdx !== -1){
      method = "DELETE";
    }
    try{
      const res = await axios({
        url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
        method,
        params: { token: this.loginToken }
      });
      if(method === "POST"){
        /** add the story to favorites if we are favoriting it */
        this.favorites.push(story);
        console.log(this.favorites);
      } else {
        /** otherwise remove it */
        this.favorites.splice(favIdx,1);
        console.log(this.favorites);
      }
      return res.data.message; //returns the message attached
    } catch(e){
      console.error("could not change favorite status", e);
    }
  }
}
